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

export const DepartmentMapper = Mapper<SourceDepartment, Department>({
  'Lark ID': 'id',
  'Department': 'name',
});

export default DepartmentMapper;
