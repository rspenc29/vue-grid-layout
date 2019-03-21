
<script>
import gridLayout from './gridLayout';
import { compact, correctBounds, debounce } from '../utils';

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
        compactType: { type: String, default: 'vertical' },
        rowHeight: { type: Number, default: 50 },
        margin: { type: Array, default: () => ([10, 10]) },
        isDraggable: { type: Boolean, default: true },
        isResizable: { type: Boolean, default: true },
    },
    data: () => ({ containerWidth: null }),
    created() {
        window.addEventListener('resize', this.resizeHandler.bind(this));
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.resizeHandler);
    },
    mounted() {
        this.containerWidth = this.$el.offsetWidth;
    },
    render(h) {
        let children = [];

        if (this.containerWidth && this.layout) {
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
                'input': value => this.$emit('layout-changed', this.breakpoint, value),
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

        layout() {
            return this.findOrGenerateLayout(this.breakpoint, this.breakpoint);
        },

        breakpoint() {
            if (!this.containerWidth) return null;
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
            if (!this.breakpoint) return null;
            if (this.layouts[breakpoint]) return this.layouts[breakpoint];

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
            layout = compact(correctBounds(layout || [], { cols }), this.compactType, cols);
            this.$emit('layout-changed', breakpoint, layout);
            return layout;
        },
    },
    watch: {
        breakpoint(newVal, oldVal) {
            this.$emit('breakpoint-changed', newVal, oldVal);
        },
    },
}
</script>

