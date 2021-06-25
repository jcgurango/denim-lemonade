import Mapper from './Mapper';

export interface Department {
  department_id: string;
  name: string;
  parent_id: string;
}

export interface SourceDepartment {
  Department: string;
  'Department Head Lark ID': string;
}

export const DepartmentMapper = Mapper<SourceDepartment, Department>({
  'id': 'department_id',
  'Department': 'name',
  'Department Head Lark ID': 'leader_open_id',
  'Parent Department': {
    destinationColumn: 'parent_id',
    sourceToDestination: (source) => {
      if (source && source.id) {
        return source.id;
      }

      return 0;
    },
    destinationToSource: (destination) => ({
      type: 'record',
      id: destination,
    }),
  },
});

export default DepartmentMapper;
