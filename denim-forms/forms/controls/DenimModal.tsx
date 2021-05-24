import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';

const OuterModal = styled.div`
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.25);
  align-items: center;
  justify-content: flex-end;

  @media screen and (min-width: 720px) {
    justify-content: center;
  }
`;

const ModalBox = styled.div`
  background-color: white;
  padding: 2em;
  border-radius: 0.5em;
  width: 100%;
  max-width: 400px;

  @media screen and (max-width: 720px) {
    border-bottom-left-radius: 0em;
    border-bottom-right-radius: 0em;
  }
`;

const DenimModal: FunctionComponent<{ visible: boolean }> = ({
  visible,
  children,
}) => {
  if (!visible) {
    return null;
  }

  return createPortal(
    <OuterModal>
      <ModalBox>{children}</ModalBox>
    </OuterModal>,
    document.body
  );
};

export default DenimModal;
