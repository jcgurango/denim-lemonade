export interface Mapper {
  destinationColumn: string;
  sourceToDestination: (data: any) => any;
  destinationToSource: (data: any) => any;
}

export interface Mapping {
  [key: string]: string | Mapper;
}

export type MapRecord = {
  [key: string]: any;
};

export default <T extends MapRecord, D extends MapRecord>(mapping: Mapping) => {
  return {
    forward: (source: any): D => {
      const destination: any = {};

      Object.keys(mapping).forEach((key) => {
        const mapColumn = mapping[key];
        const sourceValue = source[key];

        if (typeof sourceValue !== 'undefined') {
          if (typeof mapColumn === 'string') {
            destination[mapColumn] = sourceValue;
          } else {
            destination[
              mapColumn.destinationColumn
            ] = mapColumn.sourceToDestination(sourceValue);
          }
        }
      });

      return <D>(destination);
    },
    reverse: (destination: any): T => {
      const source: any = {};

      Object.keys(mapping).forEach((key) => {
        const mapColumn = mapping[key];
        let destinationValue;

        if (typeof mapColumn === 'string') {
          destinationValue = destination[key];
        } else {
          destinationValue = destination[
            mapColumn.destinationColumn
          ];
        }

        if (typeof(mapColumn) !== 'string') {
          destinationValue = mapColumn.destinationToSource(destinationValue);
        }

        if (typeof(destinationValue) !== 'undefined') {
          source[key] = destinationValue;
        }
      });

      return <T>(source);
    },
  };
};
