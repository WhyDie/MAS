/* import mongoose, { Schema, Document } from 'mongoose';

export interface IPsychologistRequest extends Document {
  type: string; // 'Анонімно' або ім'я бійця
  soldierId?: mongoose.Types.ObjectId;
  topic: string;
  severity: 'low' | 'medium' | 'high';
  status: 'new' | 'in-progress' | 'resolved';
  date: string;
}

const PsychologistRequestSchema: Schema = new Schema({
  type: {
    type: String,
    required: true,
    default: 'Анонімно'
  },
  soldierId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  topic: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved'],
    default: 'new',
  },
  date: { type: String, default: () => new Date().toLocaleString('uk-UA') },
});

export default mongoose.model<IPsychologistRequest>('PsychologistRequest', PsychologistRequestSchema);
*/