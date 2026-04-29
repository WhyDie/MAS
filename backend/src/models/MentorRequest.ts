import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorRequest extends Document {
  soldier: string;
  soldierId?: mongoose.Types.ObjectId;
  topic: string;
  text: string;
  status: 'new' | 'in-progress' | 'resolved';
  date: string;
  mentorId?: mongoose.Types.ObjectId;
}

const MentorRequestSchema: Schema = new Schema({
  soldier: {
    type: String,
    required: true,
  },
  soldierId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  topic: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved'],
    default: 'new',
  },
  date: { type: String, default: () => new Date().toLocaleString('uk-UA') },
});

export default mongoose.model<IMentorRequest>('MentorRequest', MentorRequestSchema);