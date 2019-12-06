var prod = {
    URI:(process.env.URI as string),
    privateKey:(process.env.PRIVATE_KEY as string),
    AWSSecret:(process.env.AWS_SECRET as string),
    AWSAccess:(process.env.AWS_ACCESS as string),
}
export default prod;