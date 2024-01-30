import Feature from "./feature";

export default interface Pins extends Feature<boolean> {
    // Override type
    type: 'pins';
}