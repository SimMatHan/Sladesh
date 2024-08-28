import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* CSS Variables */
  :root {
    --primary-color: #d3d2c1;
    --secondary-color: #150e07;
    --accent-color-1: #87643d;
    --accent-color-2: #d4e653;
    --background-color: #ffffff;
    --pushed-primary-color: #bfbfbd;
    --first-place-color: #d4e653;
    --second-place-color: #B79985;
    --third-place-color: #DBCCC2;
    --text-color: #333333;
    --error-color: #FF4747;
    --success-color: #4CB543;
    --pending-color: #FF9800; /* Added for pending status */
    --completed-color: #2196F3; /* Added for completed status */
    --confirmed-color: #4CB543; /* Added for confirmed status */
    --button-hover-color: #FF5722; /* Added for button hover color */
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    --border-radius: 8px;
    --padding: 10px;
    --margin: 10px;
    --box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  /* Global Styles */
  body {
    margin: 0;
    padding: 0;
    font-family: var(--font-family);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background-color);
    color: var(--text-color);
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: 600;
    color: var(--secondary-color);
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: var(--margin);
    padding: 0 var(--padding);
  }

  p {
    margin: 0 0 var(--margin) 0;
    color: var(--text-color);
    line-height: 1.5;
  }

  button {
    font-family: var(--font-family);
    font-size: 1rem;
    font-weight: 600;
  }

  input, button {
    font-family: var(--font-family);
    border-radius: var(--border-radius);
  }

  /* Add any additional global styles here */
`;

export default GlobalStyle;
