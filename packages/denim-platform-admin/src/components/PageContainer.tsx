import React, { FunctionComponent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body, #root {
    min-height: 100vh;
  }
`;

const OuterContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const HeaderContainer = styled.div`
  padding: 0.5em;
  font-size: 1.5em;
  font-weight: bold;
  border-bottom: 1px solid rgb(230, 230, 230);
`;

const BodyContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
`;

const NavigationContainer = styled.div`
  border-right: 1px solid rgb(230, 230, 230);
`;

const NavigationLink = styled(Link)`
  display: block;
  font-size: 1.25em;
  padding: 0.5em 1em;
  color: black;
  text-decoration: none;

  &.active {
    font-weight: bold;
    color: rgb(21, 96, 189);
  }

  &:hover {
    background-color: rgb(21, 96, 189);
    color: white;
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  padding: 0.75em;
`;

const PageContainer: FunctionComponent<{ style: React.CSSProperties }> = ({
  style,
  children,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <OuterContainer>
      <GlobalStyle />
      <HeaderContainer>
        DENIM v0.0.5 (Alpha Preview)
      </HeaderContainer>
      <BodyContainer>
        <NavigationContainer>
          <NavigationLink to="/" className={(currentPath === '/' || currentPath.indexOf('/connections') === 0) ? 'active' : ''}>
            Connections
          </NavigationLink>
          <NavigationLink to="/screens" className={(currentPath.indexOf('/screen') === 0) ? 'active' : ''}>
            Screens
          </NavigationLink>
          <NavigationLink to="/roles" className={(currentPath.indexOf('/role') === 0) ? 'active' : ''}>
            Roles
          </NavigationLink>
          <NavigationLink to="/users" className={(currentPath.indexOf('/users') === 0) ? 'active' : ''}>
            Users
          </NavigationLink>
          <NavigationLink to="/settings" className={(currentPath.indexOf('/settings') === 0) ? 'active' : ''}>
            App Settings
          </NavigationLink>
        </NavigationContainer>
        <ContentContainer style={style}>
          {children}
        </ContentContainer>
      </BodyContainer>
    </OuterContainer>
  );
};

export default PageContainer;
