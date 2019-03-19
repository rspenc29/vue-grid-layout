
<script>
import gridLayout from './gridLayout';
import { cloneLayout, compact, correctBounds, debounce } from '../utils';

export default {
    components: { gridLayout },
    props: {
        breakpoints: {
            type: Object,
            default: () => ({ xl: 1200, lg: 992, md: 768, sm: 576, xs: 0 }), // matches twbs
        },
        columns: {
            type: Object,
            default: () => ({ xl: 12, lg: 12, md: 6, sm: 4, xs: 3 }),
        },
        layouts: { type: Object, required: true },
        value: { type: Object, default: () => ({}) },
        compactType: { type: String, default: 'vertical' },
        rowHeight: { type: Number, default: 50 },
        margin: { type: Array, default: () => ([10, 10]) },
        isDraggable: { type: Boolean, default: true },
        isResizable: { type: Boolean, default: true },
    },
    data: () => ({
        containerWidth: null,
        layout: null,
    }),
    created() {
        window.addEventListener('resize', this.resizeHandler.bind(this));
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.resizeHandler);
    },
    mounted() {
        this.containerWidth = this.$el.offsetWidth;
        this.layout = this.findOrGenerateLayout(this.breakpoint, this.breakpoint);
    },
    render(h) {
        let children = [];

        if (this.layout) {
            let props = {
                value: this.layout,
                cols: this.cols(this.breakpoint),
                width: this.containerWidth,
                rowHeight: this.rowHeight,
                margin: this.margin,
                isDraggable: this.isDraggable,
                isResizable: this.isResizable,
            };

            let on = {
                'item-resized': event => this.$emit('item-resized', event),
            };

            children.push(h(gridLayout, { props, on }, this.$slots.default));
        }
        return h('div', { attrs: { class: 'responsive-grid-layout' } }, children);
    },
    computed: {
        cols() {
            return breakpoint => this.columns[breakpoint];
        },

        //layout() {
        //    let layout = findOrGenerateResponsiveLayout(
        //        this.layouts,
        //        this.breakpoints,
        //        this.state.breakpoint,
        //        this.state.breakpoint,
        //        this.cols,
        //        this.compactType
        //    );
        //    return syncLayoutWithChildren(layout, this.$slots.default, this.cols, this.compactType);
        //},

        breakpoint() {
            let sorted = this.sortedBreakpoints,
                matching = sorted[0],
                name, i;

            for (i = 1; i < sorted.length; i++) {
                name = sorted[i];
                if (this.containerWidth > this.breakpoints[name]) matching = name;
            }
            return matching;
        },

        sortedBreakpoints() {
            return Object.keys(this.breakpoints).sort((a, b) => this.breakpoints[a] - this.breakpoints[b]);
        },
    },
    methods: {
        resizeHandler: debounce(function() {
            this.containerWidth = this.$el.offsetWidth;
        }, 100),

        findOrGenerateLayout(breakpoint, lastBreakpoint) {
            if (this.layouts[breakpoint]) return cloneLayout(this.layouts[breakpoint]);

            let layout = this.layouts[lastBreakpoint],
                cols = this.cols(breakpoint);

            const breakpointsAbove = this.sortedBreakpoints.slice(this.sortedBreakpoints.indexOf(breakpoint));

            for (let i = 0, len = breakpointsAbove.length; i < len; i++) {
                const b = breakpointsAbove[i];
                if (this.layouts[b]) {
                    layout = this.layouts[b];
                    break;
                }
            }
            layout = cloneLayout(layout || []);
            return compact(correctBounds(layout, { cols }), this.compactType, cols);
        },
    },
    watch: {
        breakpoint(newVal, oldVal) {
            let layout = this.findOrGenerateLayout(newVal, oldVal);
            this.layout = layout;
            this.$emit('layout-changed', layout, newVal);
        },
    },
}
</script>

