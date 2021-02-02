import React, { FunctionComponent } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDenimForm } from '../providers/DenimFormProvider';

export interface DenimTabControlProps {
  tabs: {
    label: string;
    content: () => any;
  }[];
  tab: number;
  onTabChange: (newTab: number) => void;
}

const DenimTabControl: FunctionComponent<DenimTabControlProps> = ({
  tabs,
  tab,
  onTabChange,
}) => {
  const form = useDenimForm();
  const currentTab = tabs[tab || 0];
  const TabComponent = currentTab.content;

  return (
    <View
      style={[styles.container, form.styleOverrides?.tabControl?.container]}
    >
      <View
        style={[
          styles.tabHeaderContainer,
          form.styleOverrides?.tabControl?.tabHeaderContainer,
        ]}
      >
        {tabs.map((tabSchema, index) => {
          if (index === (tab || 0)) {
            return (
              <View
                style={[
                  styles.tabHeader,
                  form.styleOverrides?.tabControl?.tabHeader,
                  styles.selectedTabHeader,
                  form.styleOverrides?.tabControl?.selectedTabHeader,
                ]}
                key={`tab-${index}`}
              >
                <Text
                  style={[
                    styles.selectedTabHeaderText,
                    form.styleOverrides?.tabControl?.selectedTabHeaderText,
                  ]}
                >
                  {tabSchema.label}
                </Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              style={[
                styles.tabHeader,
                form.styleOverrides?.tabControl?.tabHeader,
              ]}
              key={`tab-${index}`}
              onPress={() => {
                onTabChange(index);
              }}
            >
              <Text
                style={[
                  styles.tabHeaderText,
                  form.styleOverrides?.tabControl?.tabHeaderText,
                ]}
              >
                {tabSchema.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View
        style={[
          styles.contentContainer,
          form.styleOverrides?.tabControl?.contentContainer,
        ]}
      >
        <TabComponent />
      </View>
    </View>
  );
};

export default DenimTabControl;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'black',
  },
  tabHeaderContainer: {
    flexDirection: 'row',
    backgroundColor: 'black',
  },
  tabHeader: {
    backgroundColor: 'black',
    padding: 12,
  },
  tabHeaderText: {
    color: 'white',
  },
  selectedTabHeader: {
    backgroundColor: 'white',
  },
  selectedTabHeaderText: {
    color: 'black',
  },
  contentContainer: {
    padding: 12,
  },
});
