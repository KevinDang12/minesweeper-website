import React, {Component} from 'react';
import {Tile} from './Tile';

const styles = {
    board: {
        display: 'flex',
        flexFlow: 'row wrap',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    }
}

export class Board extends Component {

    state = {
        boardSize: this.props.boardSize,
        boardData: this.initTileProperties(this.props.boardSize),
        firstClick: false,
        mineCount: 0
    };

    // reset() {
    //     let newGame = this.initTileProperties(this.props.size);
    //     this.setState({boardData: newGame});
    // }

    displayBoard(data) {
        let rows = [];
        let board = [];

        data.map(row => {
            row.map(item => {
                rows.push(
                    <Tile
                        onClick={() => this.onClick(item.x, item.y)}
                        onContextMenu={(e) => this.onContextMenu(e, item.x, item.y)}
                        color={item.color}
                        value={item.value}
                        disabled={item.disabled}
                    />
                );
            });
            board.push(<div style={styles.board}>{rows}</div>);
            rows = [];
        });

        return board;
    };

    countMines(data) {
        const size = this.props.boardSize;
        let mineCount = 0;

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                if (data[x][y].hasMine) {
                    mineCount += 1;
                }
            }
        }

        return mineCount;
    }

    initTileProperties(size) {
        let tileProps = [];

        for (let x = 0; x < size; x++) {
            tileProps.push([]);
            for (let y = 0; y < size; y++) {
                tileProps[x][y] = {
                    x: x,
                    y: y,
                    value: "",
                    color: 'rgb(161,160,160)',
                    click: false,
                    hasMine: false,
                    flagged: false,
                    adjacentMines: 0,
                    disabled: false,
                }
            }
        }
        return tileProps;
    }

    findAdjacentMines(tileX, tileY, data) {
        console.log("Call");
        console.log(data);
        const size = this.props.boardSize;

        data[tileX][tileY].hasMine = false;

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                let tile = data[x][y];

                if (tile === data[tileX][tileY]) continue;

                tile.hasMine = Math.random() < 0.25;
            }
        }

        let count = 0;

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                let tile = data[x][y];
                tile.adjacentMines = this.numOfAdjacentMines(this.checkAdjacent(tile));

                if (tile.hasMine) {
                    tile.value = "X";
                    count += 1;

                } else {
                    tile.value = tile.adjacentMines;
                }
            }
        }
        this.setState({mineCount: count});
        console.log(this.state.mineCount);
        return data;
    }

    checkAdjacent(tile) {
        const size = this.props.boardSize;
        let data = this.state.boardData;

        const area = [
            -1, -1,
            -1, 0,
            -1, 1,
            0, -1,
            0, 1,
            1, -1,
            1, 0,
            1, 1,
        ]

        let adjacent = [];
        let tileX = tile.x;
        let tileY = tile.y;

        for (let i = 0; i < area.length; i += 2) {
            let adjacentX = area[i];
            let adjacentY = area[i + 1];

            let currentX = adjacentX + tileX;
            let currentY = adjacentY + tileY;

            if (currentX >= 0 && currentY >= 0 && currentX < size && currentY < size) {
                adjacent.push(data[currentX][currentY]);
            }
        }
        return adjacent;
    }

    numOfAdjacentMines(adjacent) {
        let count = 0;
        for (const tile of adjacent) {
            if (tile.hasMine) {
                count += 1;
            }
        }
        return count;
    }

    onClick(x, y) {
        let data = this.state.boardData;
        let tile = data[x][y];

        if (!this.state.firstClick) {
            this.setState({firstClick: true});
            data = this.findAdjacentMines(x, y, data);
        }

        if (tile.hasMine && !tile.flag) {
            data = this.revealMines();

        } else if (!tile.click && !tile.flag) {
            tile.click = true;
            tile.value = tile.adjacentMines;
            tile.color = 'rgb(255,255,255)';

            if (tile.adjacentMines <= 0) {
                let adjacent = this.checkAdjacent(tile);
                for (const value of adjacent) {
                    this.onClick(value.x, value.y);
                }
            }
        }

        const count = this.state.mineCount;
        if (count === 0) {
            data = this.endGame(data, count);
        }
        this.setState({boardData: data});
    }

    onContextMenu(e, x, y) {
        e.preventDefault();

        let data = this.state.boardData;
        let count = this.state.mineCount;
        let tile = data[x][y];

        if (tile.disabled) {
            return;
        }

        if (tile.flag) {
            tile.flag = false;
            if (tile.hasMine) {
                tile.value = "X";
                count += 1;

            } else {
                tile.value = tile.adjacentMines;
            }

        } else if (!tile.flag && !tile.click) {
            tile.flag = true;
            tile.value = "F";
            if (tile.hasMine) {
                count -= 1;
            }
        }

        if (count === 0) {
            data = this.endGame(data, count);
        }

        this.setState({mineCount: count});
        this.setState({boardData: data});
    }

    revealMines() {
        const size = this.state.boardSize;
        let data = this.state.boardData;

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                let tile = data[x][y];

                if (tile.hasMine && !tile.flag) {
                    tile.value = "X";
                    tile.color = 'rgb(255,0,0)';

                } else if (!tile.hasMine && tile.flag) {
                    tile.color = 'rgb(255,0,0)';

                } else if (tile.hasMine && tile.flag) {
                    tile.color = 'rgb(13,154,5)';

                }
                tile.disabled = true;
            }
        }
        return data;
    }

    checkWin(count) {
        const size = this.state.boardSize;
        let data = this.state.boardData;

        if (count === 0) {
            console.log("Check")
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    let tile = data[x][y];
                    if ((!tile.hasMine && !tile.click) || (tile.hasMine && !tile.flag)) return false;
                }
            }

            return true;
        }
        return false;
    }

    endGame(data, count) {
        const size = this.state.boardSize;

        if (this.checkWin(count) === true) {
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    let tile = data[x][y];
                    if (!tile.hasMine) {
                        tile.color = 'rgb(201,253,241)';
                        tile.disabled = true;
                    }
                }
            }
        }

        return data;
    }

    render() {
        return(
            <div>
                <div className={"board"} style={{padding: '100px'}}>
                    {this.displayBoard(this.state.boardData)}
                </div>
                <div>{this.state.mineCount}</div>
            </div>
        );
    }
}