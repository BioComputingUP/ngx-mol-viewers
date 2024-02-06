export interface Remote {
    // Discriminant
    type: 'remote';
    // Remote link
    link: string;
}

export interface Local {
    // Discriminant
    type: 'local';
    // Case data is string: data already read
    // Case data is Blob or File: data must be read
    data: string | Blob | File;
}

export type Source = (Local | Remote) & {
    // Define format
    format: 'mmcif' | 'pdb';
    // Define label
    label: string;
    // Whether data is binary or not
    binary: boolean;
}
