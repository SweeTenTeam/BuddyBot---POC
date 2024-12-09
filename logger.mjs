//todo update in order to save errors
const debug = process.env.DEBUG || true;
export const logger = {
    info: (message) => {
        if(debug){
            console.log(`[INFO] ${message}`);
        }
    },
    error: (message) => {
        if(debug){
            console.error(`[ERROR] ${message}`);
        }
    }
};
