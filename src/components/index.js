
import Vue from 'vue';
import GridItem from './gridItem';
import GridLayout from './gridLayout';
import ResponsiveGridLayout from './responsiveGridLayout';

const components = { GridItem, GridLayout, ResponsiveGridLayout }

Object.keys(components).forEach(name => {
    Vue.component(name, components[name]);
});

export default components;

export * from '../utils';

