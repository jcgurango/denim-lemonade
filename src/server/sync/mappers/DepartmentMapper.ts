import Mapper from './Mapper';

export interface Department {
  id: string;
  name: string;
  parent_id: string;
}

export interface SourceDepartment {
  Department: string;
  'Department Head Lark ID': string;
}

export const SingleDepartmentMapper = Mapper<SourceDepartment, Department>({
  'id': 'id',
  'Department': 'name',
  'Department Head Lark ID': 'leader_open_id',
});

export const DepartmentMapper = (departments: Partial<SourceDepartment>[]) =>
  departments.map(SingleDepartmentMapper.forward);
