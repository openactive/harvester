
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

export default Utils;