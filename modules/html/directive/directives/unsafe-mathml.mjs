
import { ResultType } from '../../types.mjs';
import { directive } from '../directive.mjs';
import { UnsafeHTMLDirective } from './unsafe-html.mjs';

export class UnsafeMathMLDirective extends UnsafeHTMLDirective {

    constructor(partInfo) {
        super(partInfo);
    }

}

UnsafeMathMLDirective.directiveName = 'unsafeHTML';
UnsafeMathMLDirective.resultType = ResultType.MATHML;

/**
 * Renders the result as MathML, rather than text.
 *
 * The values `undefined`, `null`, and `nothing`, will all result in no content
 * (empty string) being rendered.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
export const unsafeMathML = directive(UnsafeMathMLDirective);
