import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";

const s3Region = process.env.AWS_BUCKET_REGION || '';
const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
export const s3BucketName = process.env.AWS_BUCKET_NAME || '';

const s3 = new S3Client({
    credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey
    },
    region: s3Region
});

export async function uploadFileToS3(fileBuffer: Buffer, name: string, mimeType: string) {
    const params = {
        Bucket: s3BucketName,
        Key: name,
        Body: fileBuffer,
        ContentType: mimeType
    };
    const command = new PutObjectCommand(params);

    await s3.send(command);
}

export async function getSignedUrlFromS3(name: string) {
    const params = {
        Bucket: s3BucketName,
        Key: name
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
}
