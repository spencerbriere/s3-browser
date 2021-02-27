import React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  '@global': {
    ul: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
    },
  },
  footer: {
    textAlign: 'center',
    padding: theme.spacing(3, 2),
    marginTop: 'auto',
  },
}));

export default function Copyright() {
  const classes = useStyles();

  return (
    <footer className={classes.footer}>
      <Container maxWidth="sm">
        <Typography variant="body2" color="textSecondary" align="center">
          {'Copyright © Spencer Briere '}
          {new Date().getFullYear()}.
        </Typography>
      </Container>
    </footer>
  );
}
