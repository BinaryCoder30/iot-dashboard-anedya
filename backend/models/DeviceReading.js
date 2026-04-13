import mongoose from "mongoose";

const deviceReadingSchema = new mongoose.Schema(
  {
    temperature: { type: Number, required: true },
    humidity:    { type: Number, required: true },
    status:      { type: String, default: "online" },
    relay:       { type: String, enum: ["ON", "OFF"], default: "OFF" },
  },
  { timestamps: true } // createdAt used as time-series timestamp
);

const DeviceReading = mongoose.model("DeviceReading", deviceReadingSchema);
export default DeviceReading;