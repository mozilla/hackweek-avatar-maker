
/**
 * Super simple PubSub construct with no topics and no value passing (because they weren't required)
 * @returns PubSub instance
 */
 export function simplePubSub() {
    const subs = [];
    var currSubIndex = -1;
  
    return {
        /**
         * Registers a handler to be fired by publish 
         * @param {Function} handler to be called 
         * @returns index to use to unsubscribe
         */
        subscribe(handler) {
            subs[++currSubIndex] = handler;
            return currSubIndex;
        },
    
        /**
         * Fire all subscription handlers
         */
        publish() {
            subs.forEach((sub) => sub());
        },
        
        /**
         * Removes specified handler
         * @param {number} index provided by subscribe
         */
        unsubscribe(index) {
            delete subs[index];
        }
    }
}