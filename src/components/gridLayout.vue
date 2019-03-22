
<script>
import gridItem from './gridItem';

import { bottom, compact, moveElement, syncLayoutWithChildren } from '../utils';

export default {
    components: { gridItem },
    props: {
        width: { type: Number },
        cols: { type: Number, default: 12 },
        margin: { type: Array, default: () => ([10, 10]) },
        rowHeight: { type: Number, default: 50 },
        value: { type: Array, default: () => ([]) },
        isDraggable: { type: Boolean, default: true },
        isResizable: { type: Boolean, default: true },
        preventCollision: { type: Boolean, default: false },
        compactType: {
            type: String,
            default: 'vertical',
            validator: val => (['vertical', 'horizontal'].indexOf(val) > -1),
        },
    },
    data: () => ({
        state: { activeDrag: null, layout: null },
    }),
    created() {
        this.state.layout = syncLayoutWithChildren(this.value, this.$slots.default, this.cols, this.compactType);
    },
    render(h) {
        const children = this.$slots.default.map(this.renderGridItem, this);
        if (this.state.activeDrag) {
            children.push(this.renderPlaceholder());
        }

        let context = {
            attrs: { class: 'vue-grid-layout', draggable: true },
            style: this.style,
        };

        return h('div', context, children);
    },
    computed: {
        style() {
            return { height: this.containerHeight + 'px' };
        },

        containerHeight() {
            const nbRow = bottom(this.state.layout);
            return (nbRow * this.rowHeight + (nbRow - 1) * this.margin[1]) + (this.margin[1] * 2);
        },

        containerWidth() {
            return this.width || (this.$el ? this.$el.offsetWidth : null);
        },

        colWidth() {
            let w = this.containerWidth;
            return w ? (w - (this.margin[0] * (this.cols + 1))) / this.cols : 0;
        },
    },
    methods: {
        renderGridItem(node, idx) {
            let key = node.key || String(idx),
                layout = this.layoutItem(key);

            if (!layout) return null;

            let props = {
                colWidth: this.colWidth,
                rowHeight: this.rowHeight,
                margin: this.margin,
                isDraggable: this.isDraggable,
                isResizable: this.isResizable,
                value: layout,
            };

            let data = {
                props,
                key,
                ref: 'items',
                refInFor: true,
                class: node.data.class,
                on: {
                    dragstart: this.onDragStart,
                    dragging: this.onDrag,
                    dragstop: this.onDragEnd,
                    resizestart: this.onResizeStart,
                    resizing: this.onResize,
                    resizestop: this.onResizeStop,
                },
            };

            return this.$createElement(gridItem, data, [node]);
        },

        renderPlaceholder() {
            if (!this.state.activeDrag) return null;

            let props = {
                value: { ...this.state.activeDrag },
                colWidth: this.colWidth,
                rowHeight: this.rowHeight,
                margin: this.margin,
                isDraggable: false,
                isResizable: false,
                isPlaceholder: true,
            };

            let data = {
                props: props,
                ref: 'placeholder',
                key: 'placeholder',
                attrs: { class: 'grid-item placeholder' },
            };

            return this.$createElement(gridItem, data, this.$createElement('div'));
        },
        layoutItem(id, layout) {
            layout = layout || this.state.layout || [];

            for (let i = 0; i < layout.length; i++) {
                if (layout[i].i == id) return layout[i];
            }
        },

        onDragStart() {},
        onDrag(id, childLayout, newPos) {
            this.state.activeDrag = { ...childLayout, placeholder: true };
            let layout = moveElement(this.state.layout, childLayout, newPos.x, newPos.y, true, this.preventCollision, this.compactType, this.cols);
            this.state.layout = compact(layout, this.compactType, this.cols);
        },
        onDragEnd(id, childLayout, newPos) {
            let layout = moveElement(this.state.layout, childLayout, newPos.x, newPos.y, true, this.preventCollision, this.compactType, this.cols);
            this.state.layout = compact(layout, this.compactType, this.cols);
            this.state.activeDrag = null;
            this.$emit('input', this.state.layout);
        },

        onResizeStart() {},
        onResize(id, childLayout, newSize) {
            this.state.activeDrag = { ...childLayout, ...newSize, placeholder: true };
            let l = this.layoutItem(id);
            l.w = newSize.w;
            l.h = newSize.h;
            this.state.layout = compact(this.state.layout, this.compactType, this.cols);
        },
        onResizeStop(id, childLayout, newSize) {
            let l = this.layoutItem(id);
            this.state.layout = compact(this.state.layout, this.compactType, this.cols);
            this.state.activeDrag = null;
            this.$emit('input', this.state.layout);
            this.$emit('item-resized', { ...l, ...newSize });
        },
    },
    watch: {
        // @todo Use a computed property
        value(newVal) {
            this.state.layout = syncLayoutWithChildren(newVal, this.$slots.default, this.cols, this.compactType);
        },
        colWidth() {
            // force a resize event when colWidth changes
            this.$nextTick(() => this.$refs.items.forEach(item => item.onResizeStop()));
        },
    },
}
</script>

<style>
.vue-grid-layout {
    position: relative;
    transition: height 200ms ease;
    box-sizing: border-box;
}
</style>

