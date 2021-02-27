import React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Copyright from './Copyright';

const useStyles = makeStyles((theme) => ({
  '@global': {
    ul: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
    },
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(2),
    textAlign: 'center',
  },
}));

export default function Pricing() {
  const history = useHistory();
  const classes = useStyles();

  function handleClick() {
    history.push('/home');
  }

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Container maxWidth="sm" component="main" className={classes.main}>
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="textPrimary"
          gutterBottom
        >
          Not Found
        </Typography>
        <Typography
          variant="h5"
          align="center"
          color="textSecondary"
          component="p"
        >
          The page you requested could not be found.
        </Typography>

        <br />

        <Button variant="contained" color="primary" onClick={handleClick}>
          Home
        </Button>
      </Container>
      <Copyright />
    </div>
  );
}
