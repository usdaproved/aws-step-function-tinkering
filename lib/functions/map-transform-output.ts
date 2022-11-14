// NOTE(Trystan): Could probably do some MapInput interface type thing to ensure
// that all events follow the state structure.
export const handler = async(event: any): Promise<any> => {
    if(event.state === undefined){
        throw new Error("Incorrect input");
    }

    if(event.error !== undefined){
        event.state.error = event.error;
    }

    return { ...event.state };
}