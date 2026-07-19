import mongoose from "mongoose";

export async function connectToDatabase(mongoUri: string): Promise<void> {
	if (!mongoUri) {
		throw new Error("MONGO_URI is not defined");
	}
	mongoose.set("strictQuery", true);
	await mongoose.connect(mongoUri);
}
