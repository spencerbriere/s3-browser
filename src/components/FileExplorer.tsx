/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { ChangeEvent } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import { Link as RouterLink } from 'react-router-dom';
import { createStyles, Theme } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { withStyles, Grid, Paper } from '@material-ui/core';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import TextField from '@material-ui/core/TextField';
import prettyBytes from 'pretty-bytes';
import fs from 'fs';
import path from 'path';
import Copyright from './Copyright';
import { symetricDifference } from '../utils/arrayOperations';

const styles = ({ palette, spacing }: Theme) =>
  createStyles({
    '@global': {
      ul: {
        margin: 0,
        padding: 0,
        listStyle: 'none',
      },
    },
    appBar: {
      borderBottom: `1px solid ${palette.divider}`,
    },
    toolbar: {
      flexWrap: 'wrap',
    },
    toolbarTitle: {
      flexGrow: 1,
    },
    link: {
      margin: spacing(1, 1.5),
    },
    heroContent: {
      padding: spacing(8, 2, 2),
    },
    root: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    },
    paper: {
      height: 475,
      overflow: 'scroll',
    },
    label: {
      fontWeight: 'inherit',
      color: 'inherit',
    },
    labelRoot: {
      display: 'flex',
      alignItems: 'center',
      padding: spacing(0.5, 2),
    },
    labelText: {
      fontWeight: 'inherit',
      flexGrow: 1,
    },
    treeItem: {
      minWidth: 300,
    },
  });

type TreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  size?: number;
};

interface IExplorerProps {
  classes: any;
}

interface IExplorerState {
  left: string;
  data: TreeNode[];
  selected: string[];
  expanded: string[];
}

function listDirectory(
  directory: string,
  showHidden = false,
  _recurse = true
): TreeNode[] {
  try {
    let files = fs.readdirSync(directory);
    if (!showHidden) {
      files = files.filter((item) => !/(^|\/)\.[^/.]/g.test(item));
    }
    return files.map((file) => {
      const fileStats = fs.lstatSync(path.resolve(directory, file));
      const isDirectory = fileStats.isDirectory();
      const filepath = path.join(directory, file);
      const node: TreeNode = {
        name: file,
        isDirectory,
        path: filepath,
        size: isDirectory ? undefined : fileStats.size,
        children:
          isDirectory && _recurse
            ? listDirectory(filepath, showHidden, false)
            : ([] as TreeNode[]),
      };

      return node;
    });
  } catch (e) {
    return [] as TreeNode[];
  }
}

function navigateTree(
  filepath: string[],
  nodes: TreeNode[]
): TreeNode | undefined {
  const foundNode = nodes.find((node) => {
    if (node.name === filepath[0]) {
      return true;
    }
    return false;
  });
  if (foundNode) {
    if (filepath.length === 1) {
      return foundNode;
    }
    return navigateTree(filepath.slice(1, filepath.length), foundNode.children);
  }
  return undefined;
}

class Explorer extends React.Component<IExplorerProps, IExplorerState> {
  constructor(props: any) {
    super(props);
    this.state = {
      left: '/',
      data: [
        {
          name: '/',
          path: '/',
          isDirectory: true,
          children: listDirectory('/'),
        },
      ],
      selected: [],
      expanded: ['/'],
    };
  }

  handleLeftChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    this.setState({
      left: event.target.value,
    });
  };

  handleLeftClick = () => {
    const { left } = this.state;
    const tree = listDirectory(left);
    this.setState({
      data: tree,
    });
  };

  handleToggle = (_: any, nodeIds: string[]) => {
    const { expanded, data } = this.state;

    const changedNode = symetricDifference(expanded, nodeIds)[0];

    if (expanded.length < nodeIds.length) {
      // A node was opened
      const filepath = changedNode.split('/');
      filepath[0] = '/';
      const node = navigateTree(filepath, data);
      if (node) {
        node.children = listDirectory(node.path);
      }
    }

    this.setState({
      expanded: nodeIds,
      data,
    });
  };

  handleSelect = (_: any, nodeIds: string[]) => {
    this.setState({
      selected: nodeIds,
    });
  };

  render() {
    const { classes } = this.props;
    const { left, data, selected, expanded } = this.state;

    const renderTreeLabel = (item: TreeNode) => {
      return (
        <div className={classes.labelRoot}>
          <Typography variant="body2" className={classes.labelText}>
            {item.name}
          </Typography>
          <Typography variant="caption" color="inherit">
            {typeof item.size === 'number' ? prettyBytes(item.size) : undefined}
          </Typography>
        </div>
      );
    };

    const renderTree = (items: TreeNode[]) => {
      return items.map((item) => (
        <TreeItem
          key={item.path}
          nodeId={item.path}
          label={renderTreeLabel(item)}
          className={classes.treeItem}
        >
          {renderTree(item.children)}
        </TreeItem>
      ));
    };

    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar
          position="static"
          color="default"
          elevation={0}
          className={classes.appBar}
        >
          <Toolbar className={classes.toolbar}>
            <Typography
              variant="h6"
              color="inherit"
              noWrap
              className={classes.toolbarTitle}
            >
              Files
            </Typography>
            <nav>
              <Link
                component={RouterLink}
                variant="button"
                color="textPrimary"
                to="/home"
                className={classes.link}
              >
                Home
              </Link>
              <Link
                component={RouterLink}
                variant="button"
                color="textPrimary"
                to=""
                className={classes.link}
              >
                Features
              </Link>
              <Link
                component={RouterLink}
                variant="button"
                color="textPrimary"
                to=""
                className={classes.link}
              >
                Enterprise
              </Link>
              <Link
                component={RouterLink}
                variant="button"
                color="textPrimary"
                to=""
                className={classes.link}
              >
                Support
              </Link>
            </nav>
            <Button
              href="#"
              color="primary"
              variant="outlined"
              className={classes.link}
            >
              Login
            </Button>
          </Toolbar>
        </AppBar>
        <Container component="main" className={classes.heroContent}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Paper className={classes.paper}>
                <Grid container>
                  <Grid item xs={10}>
                    <TextField
                      fullWidth
                      id="filled-basic"
                      label="Directory"
                      variant="filled"
                      value={left}
                      onChange={this.handleLeftChange}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button onClick={this.handleLeftClick}>Go</Button>
                  </Grid>
                </Grid>
                <TreeView
                  defaultCollapseIcon={<ExpandMoreIcon />}
                  defaultExpandIcon={<ChevronRightIcon />}
                  expanded={expanded}
                  selected={selected}
                  onNodeToggle={this.handleToggle}
                  onNodeSelect={this.handleSelect}
                >
                  {renderTree(data)}
                </TreeView>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper className={classes.paper}>
                <TreeView
                  defaultCollapseIcon={<ExpandMoreIcon />}
                  defaultExpanded={['root']}
                  defaultExpandIcon={<ChevronRightIcon />}
                >
                  {renderTree(data)}
                </TreeView>
              </Paper>
            </Grid>
          </Grid>
        </Container>
        <Copyright />
      </div>
    );
  }
}

export default withStyles(styles)(Explorer);
