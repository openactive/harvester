
class Utils {

  static async sleep(tag, timeSeconds){
    for (let i=0; i != timeSeconds; i++){
      if (process.env.DEBUG){
        console.log(`${tag} sleeping ${i}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

}

var cache = { postcodes: {}, counter: 0 };

export {
  cache,
  Utils,
};

export default Utils;