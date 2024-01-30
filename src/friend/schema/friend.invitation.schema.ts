import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FriendInvitationDocument = FriendInvitation & Document;

@Schema()
export class FriendInvitation {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  receiverId: Types.ObjectId;
}

export const FriendInvitationSchema = SchemaFactory.createForClass(FriendInvitation);
