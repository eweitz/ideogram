/**
 * 
 */
function Layout(config) {

    if (config.orientation === 'vertical') {
        return new VerticalLayout(config);
    } else {
        return new HorizontalLayout(config);
    }
}