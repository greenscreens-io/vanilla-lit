This is clone of Google Lit 3.0 WebComponent library rewritten in pure vanilla JavaScript.

It is rleased under the same BSD 3 License.

Even fully functional, this is a toy project not intended to be used in production.
Instead, use Google Lit Elements 3.0.

There are several reasons behind cloning and modifying original source to tailor it to our needs.
 - to remove all other wrapperas and support elements for other frameworks
 - to rely only only on rollup to combine all files into a single lib
 - to simplify debugging wihout need for server side tooling
 - to remove TyepScript, NodeJS and Babel building tools
 - to cleanup public class property space
