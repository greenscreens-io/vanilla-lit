

const trustedTypes = globalThis.trustedTypes;

const emptyStringForBooleanAttribute = trustedTypes
    ? trustedTypes.emptyScript
    : '';

export class AttributeConverter {

    toAttribute(value, type)  {
        switch (type) {
          case Boolean:
            value = value ? emptyStringForBooleanAttribute : null;
            break;
          case Object:
          case Array:
            value = value == null ? value : JSON.stringify(value);
            break;
        }
        return value;
      }
    
      fromAttribute(value = null, type) {
        let fromValue = value;
        switch (type) {
          case Boolean:
            fromValue = value !== null;
            break;
          case Number:
            fromValue = value === null ? null : Number(value);
            break;
          case Object:
          case Array:
            try {
              fromValue = JSON.parse(value);
            } catch (e) {
              fromValue = null;
            }
            break;
        }
        return fromValue;
      }

}