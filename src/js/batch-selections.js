var maxPerBatch = 600;

var queueBatch = typeof window.requestIdleCallback === 'function'
  ? function(fn) {
    window.requestIdleCallback(fn, {timeout: 500});
  }
  : setTimeout;

var callNum = 0;

function batchSelections(selection, batchFn, finishedFn) {
  // Generate random call number and set instance num
  callNum = Math.random();
  var instanceNum = callNum;

  // Initialize variables required to split selections object
  var batchList = [Object.create(selection, {
    _groups: {
      value: []
    },
    _parents: {
      value: []
    }
  })];
  var batchNumber = 0;
  var batchParentsIndex = -1;
  var batchItemCounter = 0;

  // Split existing selections object into batches
  for(var parentsIndex = 0; parentsIndex < selection._parents.length; parentsIndex++) {
    // Start a new parent in current batch
    batchParentsIndex++;
    batchList[batchNumber]._parents.push(
      selection._parents[parentsIndex]
    );
    batchList[batchNumber]._groups.push([]);

    for(var groupsIndex = 0; groupsIndex < selection._groups[parentsIndex].length; groupsIndex++) {
      if(batchItemCounter >= maxPerBatch) {
        // Start a new batch
        batchList.push(Object.create(selection, {
          _groups: {
            value: [[]]
          },
          _parents: {
            value: [selection._parents[parentsIndex]]
          }
        }));
        batchNumber++;
        batchParentsIndex = 0;
        batchItemCounter = 0;
      }

      // Push node into current batch
      batchList[batchNumber]._groups[batchParentsIndex].push(
        selection._groups[parentsIndex][groupsIndex]
      );
      batchItemCounter++;
    }
  }

  // Setup batch processing queue
  var batchIndex = 0;
  function renderBatch(){
    // If callNum does not match instanceNum cancel
    // This means that batchSelections has been called again elsewhere
    // We do not wish to have multiple batches running concurrently
    if(callNum !== instanceNum) {
      return;
    }

    batchFn(batchList[batchIndex++]);
    if(batchIndex < batchList.length) {
      queueBatch(renderBatch);
    }
    else {
      finishedFn && finishedFn();
    }
  };

  // Start batch processing
  queueBatch(renderBatch);
}

export {batchSelections};
