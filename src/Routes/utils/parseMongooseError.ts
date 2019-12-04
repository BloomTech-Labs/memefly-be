export function parseMongooseError(error:any){
    if(typeof error == "object"){
      if(error.name == "MongoError"){
        switch(error.code){
          case 11000:
            return `${error.errmsg.split('"')[1]} already taken`;
          default:
            return error.errmsg;
        }
      }else{
        return String(error)
      }
    }else{
      return error
    }
  }