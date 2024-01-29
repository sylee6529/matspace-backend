import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { prototype } from "events";
import { HydratedDocument, Types } from "mongoose";

export type userDocument = HydratedDocument<User>;

@Schema()
export class User { 
    @Prop()
    username: string;

    @Prop({ unique: true })
    email: string;

    @Prop()
    password: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
    friends: Types.ObjectId[];
}

export const userSchema = SchemaFactory.createForClass(User);