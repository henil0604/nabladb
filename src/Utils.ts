class Utils {
    private constructor() { }

    public static objectToArray(obj: any) {
        const arr = [];
        for (const key in obj) {
            arr.push(obj[key]);
        }
        return arr;
    }
}

export default Utils;