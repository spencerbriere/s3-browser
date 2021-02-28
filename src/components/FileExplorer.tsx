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
import { S3 } from 'aws-sdk';
import Copyright from './Copyright';
import { symetricDifference } from '../utils/arrayOperations';

// const electron = require('electron');
const { remote, ipcRenderer } = require('electron');

const { Menu, MenuItem } = remote;

// Importing dialog module using remote
// eslint-disable-next-line prefer-destructuring
const dialog = remote.dialog;

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

type S3Object = {
  ETag: string;
  Key: string;
  LastModified: Date;
  Owner: {
    DisplayName: string;
    ID: string;
  };
  Size: number;
  StorageClass: string;
};

type Side = 'left' | 'right';

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
  right: string;
  data: { left: TreeNode[]; right: TreeNode[] };
  selected: { left: string[]; right: string[] };
  expanded: { left: string[]; right: string[] };
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

function createFileAndPath(bucket: string, tree: TreeNode[], object: S3Object) {
  const filepath = object.Key.split('/');
  let currentTree = tree;
  let currentPath = bucket;
  filepath.forEach((name, index) => {
    currentPath = path.join(currentPath, name);
    const found = currentTree.find((node) => node.path === currentPath);
    if (found) {
      currentTree = found.children;
    } else {
      const newNode: TreeNode = {
        name,
        path: currentPath,
        isDirectory: index < filepath.length - 1,
        children: [],
        size: index === filepath.length - 1 ? object.Size : undefined,
      };
      currentTree.push(newNode);
      currentTree = newNode.children;
    }
  });
}

function parseS3Children(
  bucket: string,
  tree: TreeNode[],
  children: S3Object[]
) {
  children.forEach((object) => {
    createFileAndPath(bucket, tree, object);
  });
}

class Explorer extends React.Component<IExplorerProps, IExplorerState> {
  s3Client: S3;

  constructor(props: any) {
    super(props);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this;

    this.s3Client = new S3({
      apiVersion: '2006-03-01',
    });

    this.state = {
      left: '/',
      right: '/',
      data: {
        left: [
          {
            name: '/',
            path: '/',
            isDirectory: true,
            children: listDirectory('/'),
          },
        ],
        right: [
          {
            name: 'loading...',
            path: '/',
            isDirectory: true,
            children: [],
          },
        ],
      },
      selected: {
        left: [],
        right: [],
      },
      expanded: {
        left: ['/'],
        right: [],
      },
    };

    window.addEventListener(
      'contextmenu',
      (event) => {
        const { x, y } = event;
        event.preventDefault();
        const menu = new Menu();
        menu.append(
          new MenuItem({
            label: 'Inspect element',
            click: () => {
              remote.getCurrentWindow().inspectElement(x, y);
            },
          })
        );
        const selectedElementRow = event.path.find(
          (element: any) => element.localName === 'li'
        );
        const selectedRowId: string | undefined = selectedElementRow
          ? selectedElementRow.id
          : undefined;
        if (selectedRowId) {
          const isLocal = selectedRowId.charAt(0) === '/';
          if (isLocal) {
            menu.append(
              new MenuItem({
                label: 'Upload',
                click() {
                  console.log(`Upload ${selectedRowId}`);
                },
              })
            );
          } else {
            menu.append(
              new MenuItem({
                label: 'Download',
                click() {
                  staticThis.downloadDocument(selectedRowId);
                },
              })
            );
          }
        }
        menu.popup({ window: remote.getCurrentWindow() });
      },
      false
    );

    this.getBuckets();

    ipcRenderer.on('progress', (event, args) => this.handleProgress(args));
  }

  handleProgress = (progress) => {
    console.log(`${((progress.progress / progress.total) * 100).toFixed(2)}%`);
  };

  downloadDocument = (rowId: string) => {
    const split = rowId.split('/');
    const bucket = split.shift();
    const key = split.join('/');
    const filename = split[split.length - 1];

    dialog
      .showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, `/${filename}`),
        // defaultPath: path.join(__dirname, '../assets/'),
        buttonLabel: 'Save',
        properties: [],
      })
      .then((file) => {
        const filepath = file.filePath;
        if (!file.canceled) {
          this.s3Client
            .getSignedUrlPromise('getObject', {
              Bucket: bucket,
              Key: key,
            })
            .then(async (url) => {
              console.log(url);
              ipcRenderer.send('download_file', {
                url,
                filepath,
              });
              // Downloader.download(url, filepath, this.handleProgress);
              return true;
            })
            .catch((err) => console.log(err));
        }

        return true;
      })
      .catch((err) => console.log(err));
  };

  getBuckets = () => {
    this.s3Client
      .listBuckets()
      .promise()
      .then((response) => {
        const { data } = this.state;
        if (response && response.Buckets) {
          data.right = response.Buckets.map((bucket) => {
            return {
              name: bucket.Name ? bucket.Name : '',
              path: bucket.Name ? bucket.Name : '',
              isDirectory: true,
              children: [
                {
                  name: 'loading...',
                  path: `${bucket.Name ? bucket.Name : ''}/loading...`,
                  isDirectory: false,
                  children: [] as TreeNode[],
                },
              ],
            };
          });
          this.setState({
            data,
          });
        }
        return true;
      })
      .catch((error) => console.log('ERROR', error));
  };

  handleChange = (
    side: Side,
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (side === 'left') {
      this.setState({
        left: event.target.value,
      });
    } else {
      this.setState({
        right: event.target.value,
      });
    }
  };

  handleClick = (side: Side) => {
    dialog
      .showOpenDialog({ properties: ['openDirectory'] })
      .then((file: any) => {
        const { data, expanded, selected } = this.state;
        // Stating whether dialog operation was
        // cancelled or not.
        if (!file.canceled) {
          // Updating the GLOBAL filepath variable
          // to user-selected file.
          const filepath = file.filePaths[0].toString();
          const split = filepath.split('/');

          data[side] = [
            {
              name: split[split.length - 1],
              path: filepath,
              isDirectory: true,
              children: listDirectory(filepath),
            },
          ];

          expanded[side] = [filepath];
          selected[side] = [];

          if (side === 'left') {
            this.setState({
              data,
              left: filepath,
              expanded,
              selected,
            });
          } else {
            this.setState({
              data,
              right: filepath,
              expanded,
              selected,
            });
          }
        }
        return undefined;
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  handleLeftToggle = (_: any, nodeIds: string[]) => {
    const { expanded, data } = this.state;
    // eslint-disable-next-line react/destructuring-assignment
    const sideData = data.left;

    const changedNode = symetricDifference(expanded.left, nodeIds)[0];

    if (expanded.left.length < nodeIds.length) {
      // A node was opened
      const filepath = changedNode.split('/');
      filepath[0] = '/';
      const node = navigateTree(filepath, sideData);
      if (node) {
        node.children = listDirectory(node.path);
      }
    }

    data.left = sideData;
    expanded.left = nodeIds;

    this.setState({
      expanded,
      data,
    });
  };

  handleRightToggle = (_: any, nodeIds: string[]) => {
    const { expanded, data } = this.state;

    const changedNode = symetricDifference(expanded.right, nodeIds)[0];

    if (expanded.right.length < nodeIds.length) {
      // A node was opened
      const filepath = changedNode.split('/');
      const node = navigateTree(filepath, data.right);
      if (filepath.length === 1) {
        const params = {
          Bucket: filepath[0],
        };
        this.s3Client
          .listObjectsV2(params)
          .promise()
          .then((response) => {
            if (response.Contents) {
              const children: TreeNode[] = [];
              parseS3Children(
                filepath[0],
                children,
                response.Contents as S3Object[]
              );
              if (node) {
                node.children = children;
              } else {
                data.right = children;
              }
            }

            expanded.right = nodeIds;

            this.setState({
              expanded,
              data,
            });

            return true;
          })
          .catch((err) => console.log(err));
      } else {
        expanded.right = nodeIds;

        this.setState({
          expanded,
        });
      }
    }
  };

  handleSelect = (side: Side, _: any, nodeIds: string | string[]) => {
    const { selected } = this.state;
    let ids: string[];

    if (Array.isArray(nodeIds)) {
      ids = nodeIds;
    } else {
      ids = [nodeIds];
    }

    ids.forEach((id) => {
      const index = selected[side].indexOf(id);
      if (index === -1) {
        selected[side].push(id);
      } else {
        selected[side].splice(index, 1);
      }
    });

    this.setState({
      selected,
    });
  };

  preventEventDefault = (event: React.MouseEvent<Element, MouseEvent>) => {
    event.preventDefault();
  };

  render() {
    const { classes } = this.props;
    const { left, right, data, selected, expanded } = this.state;

    console.log(right);

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
          id={item.path}
          key={item.path}
          nodeId={item.path}
          label={renderTreeLabel(item)}
          className={classes.treeItem}
          onLabelClick={this.preventEventDefault}
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
                      onChange={(event) => this.handleChange('left', event)}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button onClick={() => this.handleClick('left')}>Go</Button>
                  </Grid>
                </Grid>
                <TreeView
                  defaultCollapseIcon={<ExpandMoreIcon />}
                  defaultExpandIcon={<ChevronRightIcon />}
                  expanded={expanded.left}
                  selected={selected.left}
                  onNodeToggle={this.handleLeftToggle}
                  onNodeSelect={(event: any, nodeIds: any) =>
                    this.handleSelect('left', event, nodeIds)
                  }
                >
                  {renderTree(data.left)}
                </TreeView>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper className={classes.paper}>
                <TreeView
                  defaultCollapseIcon={<ExpandMoreIcon />}
                  defaultExpandIcon={<ChevronRightIcon />}
                  expanded={expanded.right}
                  selected={selected.right}
                  onNodeToggle={this.handleRightToggle}
                  onNodeSelect={(event: any, nodeIds: any) =>
                    this.handleSelect('right', event, nodeIds)
                  }
                >
                  {renderTree(data.right)}
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
