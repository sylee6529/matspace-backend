import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FriendInvitation, FriendInvitationDocument } from './schema/friend.invitation.schema';
import { Model } from 'mongoose';
import { User, userDocument } from 'src/auth/user.schema';
import { CreateFriendInvitationDto } from './dto/create.friend.invitation.dto';
import { CatService } from 'src/cat/cat.service';
import { SocketService } from 'src/socket/socket.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class FriendService {
    constructor(
        @InjectModel('FriendInvitation') private friendInvitationModel: Model<FriendInvitation>,
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly socketService: SocketService,
    ){}
    
    async invite(userId: string, createFriendInvitationDto: CreateFriendInvitationDto): Promise<string> {
        const { targetEmailAddress } = createFriendInvitationDto;
    
        if (userId === targetEmailAddress) {
          throw new Error("자기 자신은 초대할 수는 없습니다.");
        }
        console.log("1", targetEmailAddress);

        const targetUser = await this.userModel.findOne({
          email: targetEmailAddress.toLowerCase(),
        });
        
        console.log("2", targetUser);

        if (!targetUser) {
          throw new Error(`${targetEmailAddress}는 존재하지 않는 유저입니다.`);
        }
    
        const invitationAlreadyReceived = await this.friendInvitationModel.findOne({
          senderId: userId,
          receiverId: targetUser._id,
        });
    
        if (invitationAlreadyReceived) {
          throw new Error("초대 요청이 이미 보내졌습니다.");
        }
    
        const usersAlreadyFriends = targetUser.friends.find(
          (friendId) => friendId.toString() === userId.toString()
        );
    
        if (usersAlreadyFriends) {
          throw new Error("이미 추가된 친구입니다.");
        }
    
        const newInvitation = await this.friendInvitationModel.create({
          senderId: userId,
          receiverId: targetUser._id,
        });
    
        this.socketService.updateFriendsPendingInvitations(targetUser._id.toString());
        
        return "초대 요청이 보내졌습니다.";
      }

      async accept(req: any, res: any) {
        try {
          const { id } = req.body;
          const { userId } = req.user;
      
          const invitation = await this.friendInvitationModel.findById(id);
      
          if (!invitation) {
            return res.status(501).send("초대장이 존재하지 않습니다.");
          }
      
          // add friends to both users
          const { senderId, receiverId } = invitation;
          const senderUser = await this.userModel.findById(senderId);
          senderUser.friends = [...senderUser.friends, receiverId];

          const receiverUser = await this.userModel.findById(receiverId);
          receiverUser.friends = [...receiverUser.friends, senderId];

          await senderUser.save();
          await receiverUser.save();
      
          // delete invitaion
          await this.friendInvitationModel.findByIdAndDelete(id);
      
          // update list of the friends if the users are online
          this.socketService.updateFriends(senderId.toString());
          this.socketService.updateFriends(receiverId.toString());
      
          // update list of friends pending invitaions
          this.socketService.updateFriendsPendingInvitations(receiverId.toString());
          return res.status(200).send("초대 요청이 허락되었습니다.");
        } catch (error) {
          console.log(error);
          return res.status(500).send("초대 수락 오류");
        }

        
    }

    async reject(req: any, res: any) {  
      try {
        const { id } = req.body;
        const { userId } = req.user;
    
        const invitationExists = await this.friendInvitationModel.exists({ _id: id });
    
        if (invitationExists) {
          await this.friendInvitationModel.findByIdAndDelete(id);
        }
    
        this.socketService.updateFriendsPendingInvitations(userId);
    
        return res.status(200).send("초대 요청이 거절되었습니다.")
    
      } catch (error) {
        console.log(error);
        return res.status(500).send("초대 거절 오류");
      }
    }

    getPendingInvitations(userId: string) {
      return this.friendInvitationModel.find({
        receiverId: userId,
      }).populate("senderId", "_id username mail");
    }
}