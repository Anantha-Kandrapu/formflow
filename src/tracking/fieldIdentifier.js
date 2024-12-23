export class FieldIdentifier {
    static getFieldIdentifiers(field) {
        return {
            id: field.id,
            name: field.name,
            className: field.className,
            xpath: this.getXPath(field),
            label: this.getFieldLabel(field)
        };
    }

    static getXPath(element) {
        if (!element) return '';
        
        const idx = (sib, name) => sib 
            ? idx(sib.previousElementSibling, name||sib.tagName) + (sib.tagName == name)
            : 1;
        
        const segs = elm => !elm || elm.nodeType !== 1 
            ? ['']
            : elm.id && document.getElementById(elm.id) === elm
                ? [`id("${elm.id}")`]
                : [...segs(elm.parentNode), `${elm.tagName}[${idx(elm)}]`];
        
        return segs(element).join('/');
    }

    static getFieldLabel(field) {
        // Try to find an associated label
        if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) return label.textContent.trim();
        }

        // Check for parent label
        const parentLabel = field.closest('label');
        if (parentLabel) return parentLabel.textContent.trim();

        // Check for aria-label
        if (field.getAttribute('aria-label')) {
            return field.getAttribute('aria-label');
        }

        return '';
    }
}