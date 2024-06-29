# Bold It

Increases font-weight of texts in a webpage.

## Considerations
* Uses inline style to specifically control each element, and only adjust the delta of the desired font-weight.
* Doesn't observe for mutations. Runs on initial page load, and on tab focus. Might change if requested upon.
