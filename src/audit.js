import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export async function auditRecord({ toFile, toS3Bucket }, data) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...data }) + "\n";
  if (toFile) {
    fs.mkdirSync("./logs", { recursive: true });
    fs.appendFileSync("./logs/audit.jsonl", line, "utf8");
  }
  if (toS3Bucket) {
    const key = `audit/${new Date().toISOString().slice(0,10)}.jsonl`;
    await s3.send(new PutObjectCommand({
      Bucket: toS3Bucket,
      Key: key,
      Body: line,
      ServerSideEncryption: "AES256" // SSE-S3
    }));
  }
}
