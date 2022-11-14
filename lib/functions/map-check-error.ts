// NOTE(Trystan): Could probably do some MapInput interface type thing to ensure
// that all events follow the state structure.
export const handler = async(event: any[]): Promise<boolean> => {
    console.log(event);
    return event.filter((item) => item.error !== undefined).length !== 0 ? true : false;
}