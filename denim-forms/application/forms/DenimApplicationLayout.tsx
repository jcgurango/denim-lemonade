import React from 'react';
import { ReactChild } from 'react';
import { FunctionComponent } from 'react';

export interface DenimApplicationLayoutProps {
  flowDirection?: 'row' | 'column';
  content: (
    | {
        id?: string;
        relativeWidth?: number;
        element: ReactChild;
      }
    | ReactChild
  )[];
}

const DenimApplicationLayout: FunctionComponent<DenimApplicationLayoutProps> =
  ({ flowDirection = 'column', content }) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: flowDirection,
          flex: 1,
        }}
      >
        {content.map((content, index) => {
          let id = `row${index}`;
          let relativeWidth = flowDirection === 'column' ? undefined : 1;
          let element = content;

          if (typeof content === 'object') {
            if ('id' in content && content.id) {
              id = content.id;
            }

            if ('relativeWidth' in content && content.relativeWidth) {
              relativeWidth = content.relativeWidth;
            }

            if ('element' in content) {
              element = content.element;
            }
          }

          return (
            <div
              key={id}
              style={{
                flex: relativeWidth,
                marginLeft:
                  flowDirection === 'row' && index > 0 ? '1em' : undefined,
                marginTop:
                  flowDirection === 'column' && index > 0 ? '1em' : undefined,
              }}
            >
              {element}
            </div>
          );
        })}
      </div>
    );
  };

export default DenimApplicationLayout;
