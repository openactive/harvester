
class Utils {

  static async sleep(tag, timeSeconds){
    for (let i=0; i != timeSeconds; i++){
      if (process.env.DEBUG){
        console.log(`${tag} sleeping ${i}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  static log(message, tag){
    if (!tag){
      tag = "";
    }

    switch(typeof(message)){
      case 'object':
        console.log(`${tag}\n ${JSON.stringify(message, null, 2)}`);
        break;
      case 'string':
        console.log(`${tag} ${message}`);
        break;
    }
  }

}

var cache = { postcodes: {}, counter: 0 };

export {
  cache,
  Utils,
};

export default Utils;