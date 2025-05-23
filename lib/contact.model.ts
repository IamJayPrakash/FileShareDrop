import mongoose, { Schema, models, model } from 'mongoose';

const ContactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.Contact || model('Contact', ContactSchema);
