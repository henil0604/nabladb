class Utils {
    constructor() { }
    static objectToArray(obj) {
        const arr = [];
        for (const key in obj) {
            arr.push(obj[key]);
        }
        return arr;
    }
}
export default Utils;
