import React, { FunctionComponent } from 'react';

export type DenimIconType = 'list' | 'pencil' | 'delete';

export interface DenimIconProps {
  type?: DenimIconType;
}

const DenimIcon: FunctionComponent<DenimIconProps> = ({ type }) => {
  if (type === 'delete') {
    return (
      <svg
        width="20"
        height="19"
        viewBox="0 0 20 19"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M5.00002 3.16667H8.33335L9.16669 3.95834H11.6667V5.54167H1.66669V3.95834H4.16669L5.00002 3.16667ZM4.16669 15.8333C3.25002 15.8333 2.50002 15.1208 2.50002 14.25V6.33334H10.8334V14.25C10.8334 15.1208 10.0834 15.8333 9.16669 15.8333H4.16669ZM18.3334 6.33334H12.5V7.91667H18.3334V6.33334ZM15.8334 12.6667H12.5V14.25H15.8334V12.6667ZM12.5 9.5H17.5V11.0833H12.5V9.5ZM4.16669 7.91667H9.16669V14.25H4.16669V7.91667Z"
          fill="black"
          fill-opacity="0.54"
        />
      </svg>
    );
  }
  if (type === 'pencil') {
    return (
      <svg
        width="20"
        height="19"
        viewBox="0 0 20 19"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M15.3073 2.60458L17.2573 4.45708C17.5823 4.76583 17.5823 5.26458 17.2573 5.57333L15.7323 7.02208L12.6073 4.05333L14.1323 2.60458C14.2906 2.45417 14.499 2.375 14.7156 2.375C14.9323 2.375 15.1406 2.44625 15.3073 2.60458ZM2.49896 13.6563V16.625H5.62396L14.8406 7.86918L11.7156 4.90043L2.49896 13.6563ZM4.9323 15.0417H4.16563V14.3133L11.7156 7.14083L12.4823 7.86916L4.9323 15.0417Z"
          fill="black"
          fill-opacity="0.54"
        />
      </svg>
    );
  }
  if (type === 'list') {
    return (
      <svg
        width="19"
        height="19"
        viewBox="0 0 19 19"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M16.2292 2.375H2.77082C2.33541 2.375 1.97916 2.73125 1.97916 3.16667V7.91667C1.97916 8.35208 2.33541 8.70833 2.77082 8.70833H16.2292C16.6646 8.70833 17.0208 8.35208 17.0208 7.91667V3.16667C17.0208 2.73125 16.6646 2.375 16.2292 2.375ZM15.4375 7.125V3.95833H3.56249V7.125H15.4375ZM15.4375 15.0417V11.875H3.56249V15.0417H15.4375ZM2.77082 10.2917H16.2292C16.6646 10.2917 17.0208 10.6479 17.0208 11.0833V15.8333C17.0208 16.2688 16.6646 16.625 16.2292 16.625H2.77082C2.33541 16.625 1.97916 16.2688 1.97916 15.8333V11.0833C1.97916 10.6479 2.33541 10.2917 2.77082 10.2917Z"
          fill="black"
          fill-opacity="0.54"
        />
      </svg>
    );
  }

  return null;
};

export default DenimIcon;
