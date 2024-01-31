export default interface Feature<T> {
    // Unique identifier
    id?: number;
    // Define feature name
    name?: string;
    // Feature type
    type: string;
    // Define values
    values: T[];
    // Define parent feature identifier
    parent?: number;
    // Whether feature is active (children are visible) or not (children not visible)
    active?: boolean;
}