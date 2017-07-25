const aws = require('aws-sdk');
const Promise = global.Promise;

aws.config.update({
    accessKeyId: process.env.AWSAccessKeyId,
    secretAccessKey: process.env.AWSSecretKey,
    region: "eu-west-1"
});

const getBucketName = function (mp3) {
    if (mp3 === 'true') {
        return process.env.S3_BUCKET_MP3;
    }
    return process.env.S3_BUCKET_PRESET;
};

module.exports.getPresignedUrl = function (fileName, fileType, mp3, operation) {
    const s3 = new aws.S3();
    const bucket = getBucketName(mp3);
    const s3Params = {
        Bucket: bucket,
        Key: fileName,
        Expires: 600,
        ContentType: fileType,
        ACL: 'public-read'
    };

    return new Promise((resolve, reject) => {
        s3.getSignedUrl(operation, s3Params, (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
module.exports.deleteObject = function (id, mp3) {
    const s3 = new aws.S3();
    const bucket = getBucketName(mp3);
    const s3Params = {
        Bucket: bucket,
        Delete: {
            Objects: [
                { Key: id }
            ],
        },
    };

    return new Promise((resolve, reject) => {
        s3.deleteObjects(s3Params, (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
