import Ember from 'ember';
import layout from '../templates/components/monaco-editor';
import getFrameById from 'ember-monaco-editor/utils/get-frame-by-id';

export default Ember.Component.extend({
  layout,
  classNames: ['monaco-editor'],
  automaticLayout: false,
  init () {
    this._super(...arguments);
    const subscription = event=> {
      // Ignore messages not coming from this iframe
      if (event.source === this.get('frame') && event.data && event.data.updatedCode) {
        this.attrs.onChange(event.data.updatedCode);
      }
    };
    this.set('_subscription', subscription);
    window.addEventListener('message', subscription);
  },
  didInsertElement () {
    this._super(...arguments);
    const frame = getFrameById(this.get('elementId'));
    const frameDoc = frame.document;
    this.set('frame', frame);
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" id="print-modal-content">
      <head>
        <script src="/vs/loader.js"></script>
        <script>
          window.require.config({ paths: { 'vs': '/vs' }});
          window.require(['vs/editor/editor.main'], function () {
            if (typeof monaco !== "undefined") {
              var editor = monaco.editor.create(document.getElementById('monaco-editor-wrapper'), {
                value: '${this.get('code')}',
                language: '${this.get('language')}',
                automaticLayout: ${this.get('automaticLayout')}
              });
              var origin = window.location.origin;
              // TODO: when the code is autocompleted we don't get this even firing
              // For example type a single ', the editor will autocomplete '' we only get
              // the first ', not ''
              editor.onDidChangeModelContent(function () {
                window.top.postMessage({updatedCode: event.target.value}, origin);
              });
            }
          });
          </script>
      </head>
      <body style="padding:0;margin:0;width:100%;height:100%;">
        <div id="monaco-editor-wrapper" style="width:100%;height:100%;border:none;"></div>
      </body>
      </html>
    `);
    frame.close();
  },
  willDestroyElement () {
    this._super(...arguments);
    window.removeEventListener('message', this.get('_subscription'));
  }
});
