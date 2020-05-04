import assert from 'assert';
import Utils from '../src/lib/utils.js';


describe('makeNextURL', function() {
  describe('absolute', function() {
    it('should return absolute URLs fine', function() {
      assert.equal(Utils.makeNextURL("http://example.com/", "https://www.openactive.io/"),"https://www.openactive.io/");
    });
    it('should return relative URLs fine', function() {
      assert.equal(Utils.makeNextURL("https://www.openactive.io/", "/cat"),"https://www.openactive.io/cat");
    });
  });
});
