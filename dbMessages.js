import mongoose from "mongoose";

const whatsappSchema = mongoose.Schema({
  message: String,
  name: String,
  timestamp: String,
  receive: Boolean,
  sender: String,
  receiver: String,
});

export default mongoose.model("messageContent", whatsappSchema);
